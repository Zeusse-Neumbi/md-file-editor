use crate::models::{FileEntry, FileState};
use std::fs;
use std::path::Path;

#[tauri::command]
pub fn open_file(path: String) -> Result<FileState, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("File not found: {}", path));
    }
    if !p.is_file() {
        return Err(format!("Not a file: {}", path));
    }
    let metadata = fs::metadata(p).map_err(|e| e.to_string())?;
    if metadata.len() > 5 * 1024 * 1024 {
        return Err("File too large (>5MB)".to_string());
    }
    let content = fs::read_to_string(p).map_err(|e| {
        if e.kind() == std::io::ErrorKind::InvalidData {
            "Cannot open binary file".to_string()
        } else {
            e.to_string()
        }
    })?;
    Ok(FileState {
        path,
        content,
        is_modified: false,
    })
}

#[tauri::command]
pub fn save_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let p = Path::new(&path);
    if !p.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }
    let mut entries = Vec::new();
    for entry in fs::read_dir(p).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_type = entry.file_type().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        let path = entry.path().to_string_lossy().to_string();
        let is_dir = file_type.is_dir();
        let is_markdown = !is_dir && name.ends_with(".md");
        entries.push(FileEntry {
            name,
            path,
            is_dir,
            is_markdown,
        });
    }
    entries.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir) // directories first
        } else {
            a.name.cmp(&b.name)
        }
    });
    Ok(entries)
}

#[tauri::command]
pub fn check_file_status(path: String) -> Result<(bool, u64), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Ok((false, 0));
    }
    let metadata = fs::metadata(p).map_err(|e| e.to_string())?;
    let mtime = metadata
        .modified()
        .map_err(|e| e.to_string())?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
    Ok((true, mtime))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_temp_file(dir: &TempDir, name: &str, content: &str) -> String {
        let path = dir.path().join(name);
        fs::write(&path, content).unwrap();
        path.to_string_lossy().to_string()
    }

    #[test]
    fn test_open_file_success() {
        let dir = TempDir::new().unwrap();
        let path = create_temp_file(&dir, "test.md", "# Hello\nWorld");
        let result = open_file(path.clone());
        assert!(result.is_ok());
        let state = result.unwrap();
        assert_eq!(state.content, "# Hello\nWorld");
        assert!(!state.is_modified);
        assert_eq!(state.path, path);
    }

    #[test]
    fn test_open_file_not_found() {
        let result = open_file("/nonexistent/file.md".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_open_file_too_large() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("large.md");
        let large_content = "x".repeat(6 * 1024 * 1024); // 6MB
        fs::write(&path, &large_content).unwrap();
        let result = open_file(path.to_string_lossy().to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("too large"));
    }

    #[test]
    fn test_open_file_binary() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("binary.md");
        let bytes: Vec<u8> = vec![0xFF, 0xFE, 0x80, 0xC0]; // non-UTF-8 bytes
        fs::write(&path, &bytes).unwrap();
        let result = open_file(path.to_string_lossy().to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("binary"));
    }

    #[test]
    fn test_open_file_directory_error() {
        let dir = TempDir::new().unwrap();
        let result = open_file(dir.path().to_string_lossy().to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Not a file"));
    }

    #[test]
    fn test_open_file_empty() {
        let dir = TempDir::new().unwrap();
        let path = create_temp_file(&dir, "empty.md", "");
        let result = open_file(path).unwrap();
        assert_eq!(result.content, "");
    }

    #[test]
    fn test_save_file_success() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("save_test.md");
        let path_str = path.to_string_lossy().to_string();
        let result = save_file(path_str.clone(), "new content".to_string());
        assert!(result.is_ok());
        let saved = fs::read_to_string(&path).unwrap();
        assert_eq!(saved, "new content");
    }

    #[test]
    fn test_save_file_permission_denied() {
        let result = save_file("/root/test.md".to_string(), "content".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_open_directory_success() {
        let dir = TempDir::new().unwrap();
        fs::write(dir.path().join("a.md"), "").unwrap();
        fs::write(dir.path().join("b.md"), "").unwrap();
        fs::create_dir(dir.path().join("subdir")).unwrap();
        fs::write(dir.path().join("subdir").join("c.md"), "").unwrap();

        let result = open_directory(dir.path().to_string_lossy().to_string());
        assert!(result.is_ok());
        let entries = result.unwrap();
        // subdir (directory) should be first, then files sorted
        assert_eq!(entries.len(), 3);
        assert!(entries[0].is_dir);
        assert_eq!(entries[0].name, "subdir");
        assert!(!entries[1].is_dir);
        assert_eq!(entries[1].name, "a.md");
    }

    #[test]
    fn test_open_directory_not_found() {
        let result = open_directory("/nonexistent".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Not a directory"));
    }

    #[test]
    fn test_open_directory_file_path() {
        let dir = TempDir::new().unwrap();
        let path = create_temp_file(&dir, "file.md", "");
        let result = open_directory(path);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Not a directory"));
    }

    #[test]
    fn test_check_file_status_exists() {
        let dir = TempDir::new().unwrap();
        let path = create_temp_file(&dir, "test.md", "hello");
        let result = check_file_status(path);
        assert!(result.is_ok());
        let (exists, mtime) = result.unwrap();
        assert!(exists);
        assert!(mtime > 0);
    }

    #[test]
    fn test_check_file_status_not_found() {
        let result = check_file_status("/nonexistent.md".to_string());
        assert!(result.is_ok());
        let (exists, mtime) = result.unwrap();
        assert!(!exists);
        assert_eq!(mtime, 0);
    }
}

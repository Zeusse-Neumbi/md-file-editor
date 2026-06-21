#[tauri::command]
pub fn get_app_version() -> String {
    "0.1.0".to_string()
}

#[tauri::command]
pub fn get_app_name() -> String {
    "MD Editor".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_app_version() {
        assert_eq!(get_app_version(), "0.1.0");
    }

    #[test]
    fn test_get_app_name() {
        assert_eq!(get_app_name(), "MD Editor");
    }
}

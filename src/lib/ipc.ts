import { invoke } from "@tauri-apps/api/core";

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  is_markdown: boolean;
}

export interface FileState {
  path: string;
  content: string;
  is_modified: boolean;
}

export async function openFile(path: string): Promise<FileState> {
  return invoke<FileState>("open_file", { path });
}

export async function saveFile(path: string, content: string): Promise<void> {
  await invoke("save_file", { path, content });
}

export async function openDirectory(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("open_directory", { path });
}

export async function checkFileStatus(path: string): Promise<[boolean, number]> {
  return invoke<[boolean, number]>("check_file_status", { path });
}

export async function getAppVersion(): Promise<string> {
  return invoke<string>("get_app_version");
}

export async function getAppName(): Promise<string> {
  return invoke<string>("get_app_name");
}

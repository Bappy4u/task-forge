export type TaskType =
  | "IMAGE_RESIZE"
  | "VIDEO_CONVERT"
  | "PDF_GENERATION"
  | "EMAIL_SEND";

export interface ICreateTaskInput {
  type: TaskType;
  payload: Record<string, any>; // File paths, email addresses, target formats, etc.
}

export enum TaskType {
  IMAGE_RESIZE = "IMAGE_RESIZE",
  VIDEO_CONVERT = "VIDEO_CONVERT",
  PDF_GENERATION = "PDF_GENERATION",
  EMAIL_SEND = "EMAIL_SEND",
}

export const TASK_TYPES = Object.values(TaskType) as TaskType[];

export interface ICreateTaskInput {
  type: TaskType;
  payload: Record<string, any>; // File paths, email addresses, target formats, etc.
}

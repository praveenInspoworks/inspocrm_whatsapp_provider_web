/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const extractErrorMessage = (error: any): string => {
  if (error?.response?.data) {
    const errorData = error.response.data;
    // Handle the specific business error format
    if (errorData.message && errorData.code === "BUSINESS_ERROR") {
      return errorData.message;
    }
    // Handle other API error formats
    if (errorData.message) {
      return errorData.message;
    }
    if (errorData.error) {
      return errorData.error;
    }
  }

  // Handle network errors or other issues
  if (error?.message) {
    return error.message;
  }

  // Fallback for unknown errors
  return "An unexpected error occurred";
};

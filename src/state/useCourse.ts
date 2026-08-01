import { useSyncExternalStore } from "react";
import {
  getActiveCourseId,
  getCourse,
  subscribeToCourse,
  type Course,
  type CourseId,
} from "@/content/course";
import { contentFor, type CourseContent } from "@/content";

/**
 * The active course, and everything it teaches.
 *
 * Subscribes to course changes so a switch re-renders the path, vocabulary,
 * families and passages together. Non-React code (the repository and sync
 * layers) reads the same value through `getActiveCourseId()`.
 */
export function useActiveCourseId(): CourseId {
  return useSyncExternalStore(subscribeToCourse, getActiveCourseId, getActiveCourseId);
}

export function useCourse(): Course {
  return getCourse(useActiveCourseId());
}

export function useCourseContent(): CourseContent {
  return contentFor(useActiveCourseId());
}

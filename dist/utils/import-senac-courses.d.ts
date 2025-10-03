import type { Course } from "../routes/admin";
export declare function importSenacCourses(jsonFilePath: string): Promise<Course[]>;
export declare function importAndSaveSenacCourses(jsonFilePath: string, outputPath: string): Promise<{
    imported: number;
    courses: Course[];
}>;
//# sourceMappingURL=import-senac-courses.d.ts.map
export interface CourseGroup {
    id: string;
    name: string;          // e.g. "GE Electives"
    sectionIds: string[];  // references ClassSection.id
    pickCount: number;     // how many to pick from this group (e.g. 2)
}
/** Interface for one Skill List of Lists for the Scholar */
export interface SkillItem {
  id: string;
  scholar: string;
  skillName: string;
  skillLevel: string;
  status: string;
}

export interface SkillItems {
  items?: SkillItem[];
}

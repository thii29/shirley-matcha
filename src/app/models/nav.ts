export interface NavChild {
  label: string;
  route: string;
}

export interface NavSection {
  label: string;
  route?: string;
  children?: NavChild[];
  expanded?: boolean;
}

import { Type } from "@angular/core";

export interface NavChild {
  label: string;
  route: string;
}

export interface NavSection {
  icon: Type<any>;
  label: string;
  route?: string;
  children?: NavChild[];
  expanded?: boolean;
}

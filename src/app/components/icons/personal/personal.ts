import { Component, input } from '@angular/core';

@Component({
  selector: 'app-personal',
  imports: [],
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    [attr.width]="size()"
    [attr.height]="size()"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="lucide lucide-square-user-round-icon lucide-square-user-round"
  >
    <path d="M18 21a6 6 0 0 0-12 0" />
    <circle cx="12" cy="11" r="4" />
    <rect width="18" height="18" x="3" y="3" rx="2" />
  </svg>`,
})
export class Personal {
  size = input<number>(24);
}

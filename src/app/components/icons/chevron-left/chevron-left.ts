import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chevron-left',
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
    class="lucide lucide-chevron-left-icon lucide-chevron-left"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>`,
})
export class ChevronLeft {
  size = input<number>(24);
}

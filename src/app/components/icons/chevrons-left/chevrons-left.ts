import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chevrons-left',
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
    class="lucide lucide-chevrons-left-icon lucide-chevrons-left"
  >
    <path d="m11 17-5-5 5-5" />
    <path d="m18 17-5-5 5-5" />
  </svg>`,
})
export class ChevronsLeft {
  size = input<number>(24);
}

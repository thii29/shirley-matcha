import { Component, input } from '@angular/core';

@Component({
  selector: 'app-category-tag',
  imports: [],
  templateUrl: './category-tag.html',
  styleUrl: './category-tag.css',
})
export class CategoryTag {
  name = input<string>('');
  color = input<string>('#3b82f6');
}

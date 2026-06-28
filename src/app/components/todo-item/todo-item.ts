import { Component } from '@angular/core';
import { CategoryTag } from "../category-tag/category-tag";

@Component({
  selector: 'app-todo-item',
  imports: [CategoryTag],
  templateUrl: './todo-item.html',
  styleUrl: './todo-item.css',
})
export class TodoItem {}

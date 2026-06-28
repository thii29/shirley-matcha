import { Component, input } from '@angular/core';
import { LucidePlus } from '@lucide/angular';
import { TodoItem } from "../todo-item/todo-item";

@Component({
  selector: 'app-daily-calendar',
  imports: [LucidePlus, TodoItem],
  templateUrl: './daily-calendar.html',
  styleUrl: './daily-calendar.css',
})
export class DailyCalendar {
  title = input('Today');
}

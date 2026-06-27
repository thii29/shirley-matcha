import { Component, input } from '@angular/core';
import { LucidePlus } from '@lucide/angular';

@Component({
  selector: 'app-daily-calendar',
  imports: [LucidePlus],
  templateUrl: './daily-calendar.html',
  styleUrl: './daily-calendar.css',
})
export class DailyCalendar {
  title = input('Today');
}

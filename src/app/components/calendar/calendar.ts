import { Component } from '@angular/core';
import { ChevronLeft } from "../icons/chevron-left/chevron-left";
import { ChevronRight } from "../icons/chevron-right/chevron-right";

type CalendarDay = {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

@Component({
  selector: 'app-calendar',
  imports: [ChevronLeft, ChevronRight],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar {}

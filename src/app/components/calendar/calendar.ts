import { Component, computed, signal } from '@angular/core';
import { ChevronLeft } from '../icons/chevron-left/chevron-left';
import { ChevronRight } from '../icons/chevron-right/chevron-right';

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
export class Calendar {
  currentDate = signal(new Date());
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  monthLabel = computed(() => {
    return this.currentDate().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  });


  private isSameDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  calendarDays = computed<CalendarDay[]>(() => {
    const date = this.currentDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay() - 1;

    const firstDateInCalendar = new Date(year, month, 1 - startDay);

    const today = new Date();

    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const current = new Date(firstDateInCalendar);
      current.setDate(firstDateInCalendar.getDate() + i);

      days.push({
        date: current,
        dayNumber: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: this.isSameDate(current, today),
      });
    }

    return days;
  });
  goToPreviousMonth() {
    const date = this.currentDate();
    this.currentDate.set(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  }

  goToNextMonth() {
    const date = this.currentDate();
    this.currentDate.set(new Date(date.getFullYear(), date.getMonth() + 1, 1));
  }
}

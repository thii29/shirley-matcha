import { Component } from '@angular/core';
import { Calendar } from "../../components/calendar/calendar";
import { DailyCalendar } from "../../components/daily-calendar/daily-calendar";

@Component({
  selector: 'app-home',
  imports: [Calendar, DailyCalendar],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}

import { Component } from '@angular/core';
import { Calendar } from "../../components/calendar/calendar";

@Component({
  selector: 'app-home',
  imports: [Calendar],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}

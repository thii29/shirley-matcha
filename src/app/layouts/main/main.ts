import { Component } from '@angular/core';
import { SideNav } from "../../components/side-nav/side-nav";

@Component({
  selector: 'app-main',
  imports: [SideNav],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}

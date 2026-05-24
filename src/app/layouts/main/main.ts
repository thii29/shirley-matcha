import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideNav } from './side-nav/side-nav';

@Component({
  selector: 'app-main',
  imports: [SideNav, RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}

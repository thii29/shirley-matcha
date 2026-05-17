import { Component } from '@angular/core';
import { Cup } from "../icons/cup/cup";
import { ChevronsLeft } from "../icons/chevrons-left/chevrons-left";
@Component({
  selector: 'app-side-nav',
  imports: [Cup, ChevronsLeft],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css',
})
export class SideNav {}

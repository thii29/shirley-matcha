import { Component } from '@angular/core';
import { ChevronsLeft } from '../icons/chevrons-left/chevrons-left';
import { ChevronsRight } from '../icons/chevrons-right/chevrons-right';
import { NavSection } from '../../models/nav';
@Component({
  selector: 'app-side-nav',
  imports: [ChevronsLeft, ChevronsRight],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css',
})
export class SideNav {
  isOpen: boolean = true;

  sideNave: NavSection[] = [
    {
      label: 'Home',
      route: '/',
    },
    {
      label: 'Workspace',
      route: '/workspace',
      expanded: true,
    },
    {
      label: 'Personal',
      route: '/personal',
      expanded: true,
    },
  ];

  handleCloseSideBar(): void {
    this.isOpen = false;
  }
}

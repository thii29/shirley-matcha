import { Component } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ChevronsLeft } from '../icons/chevrons-left/chevrons-left';
import { ChevronsRight } from '../icons/chevrons-right/chevrons-right';
import { NavSection } from '../../models/nav';
import { Home } from '../icons/home/home';
import { Workspace } from '../icons/workspace/workspace';
import { Personal } from '../icons/personal/personal';

@Component({
  selector: 'app-side-nav',
  imports: [ChevronsLeft, ChevronsRight, NgComponentOutlet],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css',
})
export class SideNav {
  isOpen: boolean = true;

  sideNav: NavSection[] = [
    {
      icon: Home,
      label: 'Home',
      route: '/',
    },
    {
      icon: Workspace,
      label: 'Workspace',
      route: '/workspace',
      expanded: true,
    },
    {
      icon: Personal,
      label: 'Personal',
      route: '/personal',
      expanded: true,
    },
  ];

  handleCloseSideBar(): void {
    this.isOpen = false;
  }
}

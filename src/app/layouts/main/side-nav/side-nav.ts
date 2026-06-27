import { NgComponentOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronsRight, LucideChevronsLeft } from '@lucide/angular';
import { Home } from '../../../components/icons/home/home';
import { Settings } from '../../../components/icons/settings/settings';
import { Workspace } from '../../../components/icons/workspace/workspace';
import { NavSection } from '../../../models/nav';

@Component({
  selector: 'app-side-nav',
  imports: [NgComponentOutlet, Settings, RouterLink, LucideChevronsRight, LucideChevronsLeft],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css',
})
export class SideNav {
  isOpen: boolean = true;
  activeRoute: string = 'home';

  sideNav: NavSection[] = [
    {
      icon: Home,
      label: 'Home',
      route: 'home',
    },
    {
      icon: Workspace,
      label: 'Workspace',
      route: 'workspace',
      expanded: true,
    },
  ];

  toggleSideBar(): void {
    this.isOpen = !this.isOpen;
  }
  setActive(route: string): void {
    this.activeRoute = route;
  }
}

import { Routes } from '@angular/router';
import { Main } from './layouts/main/main';
import { Home } from './pages/home/home';
import { Workspace } from './pages/workspace/workspace';

export const routes: Routes = [
  {
    path: '',
    component: Main,
    children: [
      { path: '', component: Home },
      { path: '/workspace', component: Workspace },
    ],
  },
];

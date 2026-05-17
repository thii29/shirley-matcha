import { Routes } from '@angular/router';
import { Main } from './layouts/main/main';
import { Home } from './pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: Main,
    children: [{ path: '', component: Home }],
  },
];

import { HomeComponent } from './components/home/home.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SplitVideoComponent } from './components/split-video/split-video.component';
import { CombineVideoComponent } from './components/combine-video/combine-video.component';

const routes: Routes = [
  {
    path: 'combine-video',
    component: CombineVideoComponent
  },
  {
    path: 'split-video',
    component: SplitVideoComponent
  },
  {
    path: "",
    component: HomeComponent
  },
  {
    path: "**",
    component: HomeComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

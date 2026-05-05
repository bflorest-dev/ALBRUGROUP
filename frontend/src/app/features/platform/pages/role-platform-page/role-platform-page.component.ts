import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-role-platform-page',
  templateUrl: './role-platform-page.component.html',
  styleUrl: './role-platform-page.component.scss'
})
export class RolePlatformPageComponent {
  protected readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}

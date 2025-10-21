import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AvisService } from '../Services/avis.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;
  rating: number = 0
  avis: any[] = [];
  isLoading: boolean = true;
  form: FormGroup;
  nomUtilisateur: string ="";

  constructor(private fb: FormBuilder, private myService: AvisService,    private router: Router) {
    
    this.form = this.fb.group({
      note: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      commentaire: ['', Validators.required],
      dateAvis: [new Date().toISOString().split('T')[0]],  // Date actuelle
      user_id: null,                    // à remplacer dynamiquement
      reservation_id: ['681621b8699d6c8bdae1c059']         // à remplacer dynamiquement
    });
  }
  decodeToken(token: string | null): any {
    if (!token) return null;
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  }
  ngOnInit(): void {
    this.myService.getAvis().subscribe(
      (data) => {
        console.log("avis reçus :", data);
        this.avis = data.avis;
        this.isLoading = false;
  
      },
      (error) => {
        console.error("Erreur lors de la récupération des avis :", error);
        this.isLoading = false;
      }
   
    );  
    const token = localStorage.getItem('token');
    const decoded = this.decodeToken(token);
    const userId = decoded.user_id;
    console.log(decoded);
  
    this.form.patchValue({ user_id: userId });
    if (decoded && decoded.name ) {
      this.nomUtilisateur = `${decoded.name}`;
    }
  }

  submitComment(): void {
    const token = localStorage.getItem('token');
    const decoded = this.decodeToken(token);
    console.log(decoded);
  
    if (decoded && decoded.user_id) {
      if (this.form.valid) {
        this.myService.createavis(this.form.value).subscribe({
          next: (res) => {
            console.log('Avis envoyé', res);
            this.form.reset();
            // Recharge les avis après ajout
            this.ngOnInit();
          }
        });
      }
    } else {
      this.router.navigate(['/Login']);
    }
  }
  

  scrollLeft() {
    this.scrollContainer.nativeElement.scrollBy({ left: -525, behavior: 'smooth' });
  }

  scrollRight() {
    this.scrollContainer.nativeElement.scrollBy({ left: 525, behavior: 'smooth' });
  }

  startAutoScroll() {
    setInterval(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }, 1000);
  }
  
}
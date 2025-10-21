import { Component, OnInit } from '@angular/core';
import { UserService } from '../Services/user.service';
import { PayeService } from '../Services/paye.service';
import { ReservationService } from '../Services/reservation.service';
import { HotelService } from '../Services/hotel.service';
import { ChartOptions } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChambreService } from '../Services/chambre.service';

interface Hotel {
  id: string;
  nomHotel: string;
  paye_id: string;
  classement: number;
  adresse: string;
  imageHotel: string[];
  datedabut: string;
  datefin: string;
  chambres?: Chambre[];
  startingPrice?: number;
}

interface Chambre {
  id: string;
  hotel_id: string;
  typeChambre?: string;
  prixchambre?: number;
}

interface Reservation{
    dateReservation: string;
    placesDisponibles: number;
    dateDepart: string;
    dateRetour: string;
    typeReservation: string;
    hotel_id: string;
    chambre_id:string;
    avis_id?:Avis[];
}

interface Avis{
    note: number;
    commentaire: string;
    dateAvis: string;
    user_id: string;
    reservation_id:string;
  }

@Component({
  selector: 'app-dashboard3',
  templateUrl: './dashboard3.component.html',
  styleUrls: ['./dashboard3.component.css']
})
export class Dashboard3Component implements OnInit {

  nbUsers: number = 0;
  nbHotels: number = 0;
  nbChambres: number = 0;
  nbReservations: number = 0;
  nbpayes: number = 0;

  // Données pour le graphique
  chartLabels: string[] = [];
  chartDataValues: number[] = [];

  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  constructor(
    private us: UserService,
    private ps: PayeService,
    private rs: ReservationService,
    private hs: HotelService,
    private cs: ChambreService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin([
      this.us.getAllUsers().pipe(catchError(() => of(null))),
      this.ps.getAllPaye().pipe(catchError(() => of(null))),
      this.rs.getAllReservation().pipe(catchError(() => of(null))),
      this.hs.GetAllHotel().pipe(catchError(() => of(null))),
      this.cs.getAllChambre().pipe(catchError(() => of(null)))
    ]).subscribe(([userData, payeData, reservationData, hotelData, chambreData]) => {
      if (userData) this.nbUsers = userData.users?.length || 0;
      if (payeData) this.nbpayes = payeData.payes?.length || 0;
      if (reservationData) this.nbReservations = reservationData.reservations?.length || 0;
      if (hotelData) this.nbHotels = hotelData.hotels?.length || 0;
      if (chambreData) this.nbChambres = chambreData.chambres?.length || 0;

      if (reservationData && chambreData) {
        this.prepareChartData(reservationData.reservations,chambreData.chambres);
      }
    });
  }

  prepareChartData(reservations: Reservation[], chambres: Chambre[]): void {
    const chambresMap = new Map<string, string>();
    for (const chambre of chambres) {
      chambresMap.set(chambre.id, <string>chambre.typeChambre);
    }
    console.log("**"+chambresMap)
    

    const countByChambresName: Map<string, number> = new Map();

    reservations.forEach(reservation => {
      const chambreName = chambresMap.get(reservation.chambre_id) || 'Inconnu'; // ✅ Correction ici
      console.log("fffff "+chambreName)
      const count = countByChambresName.get(chambreName) || 0;
      countByChambresName.set(chambreName, count + 1);
    });

    // Convertir en tableau pour chart.js
    this.chartLabels = Array.from(countByChambresName.keys());
    this.chartDataValues = Array.from(countByChambresName.values());

    console.log("Nombre d'hôtels par pays:", Object.fromEntries(countByChambresName));
  }

  get chartData() {
    return {
      labels: this.chartLabels,
      datasets: [
        {
          label: 'Nombre d\'hôtels par pays',
          data: this.chartDataValues,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9C27B0', '#FF9800'
          ]
        }
      ]
    };
  }
}
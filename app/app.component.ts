import {Component, Directive} from '@angular/core';
import {NorthwindService} from './services/northwind.service';


@Component({
  selector: 'ej-app',
  templateUrl: 'app/app.component.html',
  styles: ['.e-grid{position:inherit !important'],
  providers: [NorthwindService]
})
export class AppComponent {
  public gridData: any;
  public value: any;
  constructor(private service: NorthwindService) {
    this.gridData = [{ OrderID: 10280, CustomerID: "BERGS", EmployeeID: 2, OrderDate: new Date(840006e6), RequiredDate: new Date(8424252e5), ShippedDate: new Date(8425116e5), ShipVia: 1, Freight: 8.98, ShipName: "Berglunds snabbköp", ShipAddress: "Berguvsvägen  8", ShipCity: "Luleå", ShipRegion: null, ShipPostalCode: "S-958 22", ShipCountry: "Sweden", CompanyName: "Berglunds snabbköp", Address: "Berguvsvägen  8", City: "Luleå", Region: null, PostalCode: "S-958 22", Country: "Sweden" }, { OrderID: 10265, CustomerID: "BLONP", EmployeeID: 2, OrderDate: new Date(838278e6), RequiredDate: new Date(8406972e5), ShippedDate: new Date(8398332e5), ShipVia: 1, Freight: 55.28, ShipName: "Blondel père et fils", ShipAddress: "24, place Kléber", ShipCity: "Strasbourg", ShipRegion: null, ShipPostalCode: "67000", ShipCountry: "France", CompanyName: "Blondesddsl père et fils", Address: "24, place Kléber", City: "Strasbourg", Region: null, PostalCode: "67000", Country: "France" }, { OrderID: 10663, CustomerID: "BONAP", EmployeeID: 2, OrderDate: new Date(8738748e5), RequiredDate: new Date(8750844e5), ShippedDate: new Date(875862e6), ShipVia: 2, Freight: 113.15, ShipName: "Bon app'", ShipAddress: "12, rue des Bouchers", ShipCity: "Marseille", ShipRegion: null, ShipPostalCode: "13008", ShipCountry: "France", CompanyName: "Bon app'", Address: "12, rue des Bouchers", City: "Marseille", Region: null, PostalCode: "13008", Country: "France" }];
    this.value = new Date();
  }

  onClick(event: any){
    // alert("hello" + event);
    let data = { OrderID: 99999, CustomerID: "Temp", EmployeeID: 34, OrderDate: new Date(840006e6), RequiredDate: new Date(8424252e5), ShippedDate: new Date(8425116e5), ShipVia: 1, Freight: 8.98, ShipName: "Berglunds snabbköp", ShipAddress: "Berguvsvägen  8", ShipCity: "Luleå", ShipRegion: null, ShipPostalCode: "S-958 22", ShipCountry: "Sweden", CompanyName: "Berglunds snabbköp", Address: "Berguvsvägen  8", City: "Luleå", Region: null, PostalCode: "S-958 22", Country: "Sweden" };
    let temp = this.gridData.slice();
    temp.push(data);
    this.gridData = temp;
  }
}
import { Component } from '@angular/core';
import { NavController,ToastController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Toast } from '@ionic-native/toast';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import { Network } from '@ionic-native/network';
import { DataServiceProvider } from '../../providers/data-service/data-service';
import { NativeStorage } from '@ionic-native/native-storage';
import { DomSanitizer } from '@angular/platform-browser';
import { LoadingController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

	products: any[] = [];
	lastSyncTime:any;
	selectedProduct: any;
	barcodeCode: any;
	productFound:boolean = false;
	flags:any;
	loading:any;

  constructor(public navCtrl: NavController,
  	private barcodeScanner: BarcodeScanner,
	private toast: Toast,
  	private transfer: FileTransfer,
  	private file: File,
  	private toastCtrl: ToastController,
  	private network: Network,
  	private nativeStorage: NativeStorage,
  	public loadingController:LoadingController,
  	public dataService: DataServiceProvider) {
  	this.flags = 0;
  	this.loading = this.loadingController.create({content : "Syncing ,please wait..."});
  	this.dataService.checkFileDetails();
		  this.nativeStorage.getItem('lastSyncTime')
	  .then(
	    data => {
	    	console.log(data);
	    	this.lastSyncTime=data;
	    },
	    error => console.error(error)
	  );
  }

  download(url,name){
  	const fileTransfer: FileTransferObject = this.transfer.create();
  	 console.log('Download Started');
  	 console.log(this.file.dataDirectory);
  	 console.log(this.file.externalRootDirectory);
  	 console.log(this.file.externalApplicationStorageDirectory);
     fileTransfer.download(url, this.file.externalApplicationStorageDirectory + name).then((entry) => {
	    console.log('download complete: ' + entry.toURL());
	    this.sync();
	  }, (error) => {
	    // handle error
	  });   
  }

  ionViewDidLoad() {
	console.log(2);
	this.file.readAsText(this.file.externalRootDirectory, 'crevol/products1.txt')
	      .then(content=>{
	        console.log(content);
	        this.products = JSON.parse(content);
	        })
	      .catch(err=>{
	        console.log(err);
	      });
    // Put here the code you want to execute
   
  }
  callagain(){
	this.flags++;
	this.sync();
  }

  subscribeNetwork(){
  	if(this.network.type=='none'){
  		this.displayNetworkUpdate('offline');
  	}
  	this.network.onConnect().subscribe(data => {
	    this.displayNetworkUpdate(data.type);
	}, error => console.error(error));
	 
	this.network.onDisconnect().subscribe(data => {
	    this.displayNetworkUpdate(data.type);
	}, error => console.error(error));
  }

  sync(){
  	this.loading.present();
  	this.subscribeNetwork();
  	if(this.network.type!='none'){
  		console.log(this.products);
  		if(this.products.length > this.flags){
  			var fileurl = this.products[this.flags].image;
	    	var filename = this.products[this.flags].imagename;
	    	this.file.checkFile(this.file.externalApplicationStorageDirectory, this.products[this.flags].imagename).then(_ => 
		  		console.log('Image exists'))
		  	.catch(err => 
		  		this.download(fileurl,filename)
		  	);
		  	this.flags++;
  		}else{
  			this.loading.dismissAll();
  		}
	}
  }

  displayNetworkUpdate(connectionState: string){
	  let networkType = this.network.type;
	  this.toastCtrl.create({
	    message: `You are now ${connectionState} via ${networkType}`,
	    duration: 3000
	  }).present();
	}

	scan() {
	  this.selectedProduct = {};
	  this.barcodeScanner.scan().then((barcodeData) => {
	  	console.log(barcodeData);
	  	this.barcodeCode = barcodeData.text;
	    this.selectedProduct = this.products.find(product => product.plu === barcodeData.text);
	    if(this.selectedProduct !== undefined) {
	    	this.selectedProduct.newurl = this.file.externalApplicationStorageDirectory+this.selectedProduct.imagename;
	      this.file.checkFile(this.file.externalApplicationStorageDirectory, this.selectedProduct.imagename).then(_ => 
		  		this.selectedProduct.imagefound = true)
		  	.catch(err => 
		  		this.selectedProduct.imagefound = false
		  	);
		  	this.productFound = true;
	    } else {
	      this.productFound = false;
	      this.toast.show(`Product not found`, '5000', 'center').subscribe(
	        toast => {
	          console.log(toast);
	        }
	      );
	    }
	  }, (err) => {
	    this.toast.show(err, '5000', 'center').subscribe(
	      toast => {
	        console.log(toast);
	      }
	    );
	  });
	}

}

let products = [];
const getProductsData =  async ()=>{
    const response =  await fetch("https://dummyjson.com/products");
    const data = await response.json();
    products = data.products;
    console.log(products);


const productContainer = document.getElementById("products-container");

for(let i = 0; i<20; i++){

const div = document.createElement("div");

const img = document.createElement("img");
img.src = products[i].thumbnail;
img.alt = products[i].title;


const title = document.createElement("h1");
title.innerText  = "Product title";


const price = document.createElement("h2");
price.innerText = "$"+ products[i].price;


const decrementBtn = document.createElement("button");
decrementBtn.innerText = "-";

const incrementBtn  = document.createElement("button");
incrementBtn.innerText = "+";


const span = document.createElement("span");
span.innerText = "ADD";


div.appendChild(img);
div.appendChild(title);
div.appendChild(price);
div.appendChild(span);
div.appendChild(decrementBtn);
div.appendChild(incrementBtn);
productContainer.appendChild(div);

let count = 0;
incrementBtn.addEventListener("click", ()=>{
    count++;
    span.innerText = count;
})
 
decrementBtn.addEventListener("click", ()=>{
    if(count>0){
        count--;
        span.innerText = count;
    }
})

}
};
getProductsData();
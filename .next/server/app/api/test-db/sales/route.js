(()=>{var e={};e.id=880,e.ids=[880],e.modules={28303:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=28303,e.exports=t},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79428:e=>{"use strict";e.exports=require("buffer")},55511:e=>{"use strict";e.exports=require("crypto")},94735:e=>{"use strict";e.exports=require("events")},91645:e=>{"use strict";e.exports=require("net")},19771:e=>{"use strict";e.exports=require("process")},27910:e=>{"use strict";e.exports=require("stream")},41204:e=>{"use strict";e.exports=require("string_decoder")},66136:e=>{"use strict";e.exports=require("timers")},34631:e=>{"use strict";e.exports=require("tls")},79551:e=>{"use strict";e.exports=require("url")},28354:e=>{"use strict";e.exports=require("util")},74075:e=>{"use strict";e.exports=require("zlib")},4573:e=>{"use strict";e.exports=require("node:buffer")},53053:e=>{"use strict";e.exports=require("node:diagnostics_channel")},14191:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>x,routeModule:()=>d,serverHooks:()=>_,workAsyncStorage:()=>l,workUnitAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{POST:()=>p});var i=r(42706),a=r(28203),o=r(45994),n=r(39187),u=r(60820);async function c(e,t){let[r]=await e.query(`
    SELECT COUNT(*) AS total
    FROM sales
    WHERE shop_id = ? AND DATE(sale_date) = CURDATE()
    `,[t]),s=Number(r[0]?.total||0)+1,i=new Date,a=i.getFullYear(),o=String(i.getMonth()+1).padStart(2,"0"),n=String(i.getDate()).padStart(2,"0"),u=String(s).padStart(3,"0");return`SL-${a}${o}${n}-${u}`}async function p(e){let t=null;try{let r=await e.json();if(!r.items||!Array.isArray(r.items)||0===r.items.length)return n.NextResponse.json({success:!1,message:"Le panier est vide."},{status:400});let s=r.payment_method||"cash";t=await u.createConnection({host:process.env.DB_HOST||"127.0.0.1",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||"root",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"boutique_saas"}),await t.beginTransaction();let i=[];for(let e of r.items){let[r]=await t.query(`
        SELECT
          id,
          name,
          stock_quantity,
          cost_price,
          selling_price,
          is_active
        FROM products
        WHERE id = ? AND shop_id = ?
        LIMIT 1
        `,[e.id,1]),s=r[0];if(!s)throw Error(`Produit introuvable (ID ${e.id}).`);if(!Number(s.is_active))throw Error(`${s.name} est inactif.`);let a=Number(s.stock_quantity),o=Number(e.quantity||0);if(o<=0)throw Error(`Quantit\xe9 invalide pour ${s.name}.`);if(a<o)throw Error(`Stock insuffisant pour ${s.name}.`);let n=Number(s.cost_price||0),u=Number(s.selling_price||e.price||0),c=u*o;i.push({productId:Number(s.id),name:String(s.name),quantity:o,stock:a,unitCost:n,unitPrice:u,lineTotal:c})}let a=i.reduce((e,t)=>e+t.lineTotal,0),o=a+0-0,p=await c(t,1),[d]=await t.execute(`
      INSERT INTO sales (
        shop_id,
        sale_number,
        customer_name,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        payment_method,
        payment_status,
        sale_status,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'completed', ?)
      `,[1,p,r.customer_name||null,a,0,0,o,s,r.notes||null]),l=d.insertId;for(let e of i)await t.execute(`
        INSERT INTO sale_items (
          sale_id,
          product_id,
          quantity,
          unit_cost,
          unit_price,
          line_total
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,[l,e.productId,e.quantity,e.unitCost,e.unitPrice,e.lineTotal]),await t.execute(`
        UPDATE products
        SET stock_quantity = stock_quantity - ?
        WHERE id = ? AND shop_id = ?
        `,[e.quantity,e.productId,1]),await t.execute(`
        INSERT INTO stock_movements (
          shop_id,
          product_id,
          movement_type,
          quantity,
          reference_type,
          reference_id,
          note
        )
        VALUES (?, ?, 'out', ?, 'sale', ?, ?)
        `,[1,e.productId,e.quantity,l,`Sortie vente ${p}`]);return await t.commit(),n.NextResponse.json({success:!0,message:`Vente ${p} enregistr\xe9e avec succ\xe8s.`,saleId:l,saleNumber:p,totalAmount:o})}catch(e){return t&&await t.rollback(),console.error("API /api/sales error:",e),n.NextResponse.json({success:!1,message:e instanceof Error?e.message:"Une erreur est survenue pendant l'enregistrement."},{status:500})}finally{t&&await t.end()}}let d=new i.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/test-db/sales/route",pathname:"/api/test-db/sales",filename:"route",bundlePath:"app/api/test-db/sales/route"},resolvedPagePath:"C:\\Users\\admexp-nims\\Desktop\\boutique-premium-starter-fixed\\src\\app\\api\\test-db\\sales\\route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:l,workUnitAsyncStorage:m,serverHooks:_}=d;function x(){return(0,o.patchFetch)({workAsyncStorage:l,workUnitAsyncStorage:m})}},96487:()=>{},78335:()=>{}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[989,820,452],()=>r(14191));module.exports=s})();
export type InspectContext={act:1|2|3|4;seenPhoto:boolean};
type Description={label:string;thought:(ctx:InspectContext)=>string|undefined};
const routine=(line:string)=>(ctx:InspectContext)=>ctx.act===1?line:undefined;
const objects={
 deskDetails:{label:'Mirar las cosas de Erik',thought:({act})=>act===1?'El cubo de Rubik y los apuntes de Erik... siempre los deja aquí en medio.':act===2||act===3?'Ahora mismo no me importa el escritorio...':undefined},
 desk:{label:'Mirar el escritorio de Erik',thought:({act})=>act===1?'Erik dejó la silla sin recoger otra vez antes de bajar...':act===2||act===3?'No es momento de ponerse con el ordenador...':undefined},
 loft:{label:'Mirar la litera',thought:({act})=>act===1?'Qué sueño me está entrando ya, ojalá vuelvan pronto.':act===3?'Si me agacho debajo cabe justo una persona... tengo que esconderme.':undefined},
 sofa:{label:'Mirar el sofá y la mesa',thought:routine('Estábamos viendo la tele hace un rato antes de que salieran a por el recado.')},
 shelf:{label:'Mirar la estantería',thought:routine('Las fotos de siempre... parece una noche cualquiera.')},
 fridge:{label:'Mirar la nevera',thought:routine('Hace ese zumbido de siempre por las noches.')},
 balcony:{label:'Mirar hacia el balcón',thought:({act,seenPhoto})=>act===1?'La calle está completamente vacía a estas horas.':act===2&&seenPhoto?'Desde aquí fuera me hicieron la foto... quién narices era.':undefined},
 bed:{label:'Mirar la cama de matrimonio',thought:routine('Papá dejó la cama perfecta antes de irse.')},
 rack:{label:'Mirar el tendedero',thought:routine('La ropa lleva tendida desde esta tarde.')},
 bath:{label:'Mirar el lavabo o la ducha',thought:routine('Todo en orden por aquí.')},
 entry:{label:'Mirar junto a la puerta de entrada',thought:({act})=>act===2||act===3?'Faltaba una copia de las llaves desde hace semanas... no puede ser.':undefined},
} satisfies Record<string,Description>;
export type InspectId=keyof typeof objects;
export function inspection(id:InspectId,ctx:InspectContext){const item=objects[id],text=item?.thought(ctx);return text?{label:item.label,text}:undefined;}

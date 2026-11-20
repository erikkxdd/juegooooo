const lines = [
  'Qué buena eres, Lola...',
  '¿Quién es la perrita más lista de toda la casa?',
  'Tranquila, pequeña, en nada vuelven papá y Erik.',
  'Menos mal que estás aquí conmigo, eh.',
  '¿Tienes hambre ya o qué?',
  'Qué suave estás hoy, Lola.',
  'No te separes mucho de mí, ¿vale?',
  'Tú siempre vigilando la casa, ¿verdad?',
  'Qué haría yo sola sin ti...',
  'Eres la mejor guardiana del mundo.',
  'Ay, qué carita me pones...',
  'Quédate cerquita, que esta noche está muy silenciosa.',
  '¿Te gusta que te rasque detrás de las orejas?',
  'Buena chica, Lola, muy buena.',
  'No te preocupes, estamos seguras aquí dentro.',
  'Pareces un peluche cuando te sientas así.',
  '¿Por qué me miras con esa cara tan seria?',
  'Ahora mismo llega Erik a hacerte rabiar.',
  'Qué calentita estás, ven aquí.',
  'Siempre tan pendiente de cada ruido, ¿eh?',
  'Toma mimitos, que te los has ganado.',
  'Ojalá pudiera saber qué estás pensando.',
  'Tranquila, Lola, no pasa nada...',
  'Qué ojitos tienes, pequeña.',
  'Venga, sigue conmigo.',
  'Ya sé, ya sé... cinco caricias más.',
  'Con esa carita es imposible decirte que no.',
  '¿Me estabas esperando, pequeña?',
  'Mira cómo mueves la cola, Lola.',
  'Ven, te hago un hueco a mi lado.',
] as const;

export function createLolaLinePicker(random = Math.random) {
  let previous = -1;
  return () => {
    let index = Math.floor(random() * (lines.length - Number(previous !== -1)));
    if (previous !== -1 && index >= previous) index++;
    previous = index;
    return lines[index];
  };
}

import {defineConfig} from 'vite';
export default defineConfig({base:'./',server:{host:'0.0.0.0',allowedHosts:true},build:{rolldownOptions:{output:{codeSplitting:{groups:[{name:'three',test:/node_modules[\\/]three[\\/]/,maxSize:350000}]}}}}});

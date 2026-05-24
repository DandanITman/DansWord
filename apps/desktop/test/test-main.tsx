import { createRoot } from 'react-dom/client';
import { installMockDansword } from '../../../tests/helpers/mock-dansword';
import App from '../src/App';
import '../src/styles/global.css';

document.documentElement.setAttribute('data-test-mode', 'true');
installMockDansword(window);

createRoot(document.getElementById('root')!).render(<App />);

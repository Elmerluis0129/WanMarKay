import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const FAQ: React.FC = () => (
  <Box sx={{ p: 4 }}>
    <Typography variant="h4" gutterBottom sx={{ color: '#E31C79' }}>
      Preguntas Frecuentes
    </Typography>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        ¿Cómo creo una factura?
      </AccordionSummary>
      <AccordionDetails>
        Ve a "Crear Factura" en el panel de administrador y completa el formulario.
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        ¿Cómo registro un pago?
      </AccordionSummary>
      <AccordionDetails>
        Abre los detalles de la factura y haz clic en "Registrar Pago".
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        ¿Cómo edito mis datos de usuario?
      </AccordionSummary>
      <AccordionDetails>
        En la sección "Mi Perfil", actualiza tu información y guarda los cambios.
      </AccordionDetails>
    </Accordion>
  </Box>
);

export default FAQ; 
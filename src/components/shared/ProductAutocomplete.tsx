import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, List, ListItem, ListItemText, Paper, Popper, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { productoService } from '../../services/productoService';
import { Producto } from '../../types/producto';

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({ value, onChange, label = 'Descripción', placeholder = 'Buscar producto...' }) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Producto[]>([]);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!open || !inputValue) {
      setOptions([]);
      return;
    }
    setLoading(true);
    productoService.getProductos(inputValue)
      .then(setOptions)
      .finally(() => setLoading(false));
  }, [open, inputValue]);

  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={inputValue}
        placeholder={placeholder}
        onChange={e => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={e => {
          setAnchorEl(e.currentTarget as HTMLInputElement);
          setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150); // Permite click en sugerencia
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          )
        }}
      />
      <Popper open={open && !!options.length} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1301 }}>
        <Paper sx={{ width: anchorEl?.offsetWidth || 300, maxHeight: 220, overflow: 'auto' }}>
          {loading ? (
            <ListItem><CircularProgress size={20} /></ListItem>
          ) : (
            <List>
              {options.map(option => (
                <ListItem
                  key={option.id}
                  button
                  onMouseDown={() => {
                    onChange(option.nombre);
                    setInputValue(option.nombre);
                    setOpen(false);
                  }}
                >
                  <ListItemText
                    primary={option.nombre}
                    secondary={option.codigo ? `Código: ${option.codigo}` : undefined}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Popper>
    </>
  );
};

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  useTheme,
  Divider,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  Container,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableCellProps,
  Collapse
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { 
  Star as StarIcon, 
  EmojiEvents as EmojiEventsIcon,
  Loyalty as LoyaltyIcon,
  Info as InfoIcon,
  CardGiftcard as GiftIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Navigation } from './Navigation';
import { userService } from '../../services/userService';
import { auth } from '../../services/auth';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

// Types
type LoyaltyTier = {
  id: string;
  name: string;
  minDays: number;
  maxDays?: number;
  color: string;
  benefits: string[];
  icon: React.ReactNode;
  description: string;
};

type CustomerData = {
  id: string;
  name: string;
  joinDate: string;
  totalPurchases: number;
  tier?: string;
  email?: string;
  phone?: string;
  daysAsCustomer?: number;
  joinDateFormatted?: string;
};

// No necesitamos más los datos de prueba

const loyaltyTiers: LoyaltyTier[] = [
  {
    id: 'new',
    name: 'Nuevo',
    minDays: 0,
    maxDays: 90,
    color: '#4CAF50', // Green
    benefits: [
      '5% de descuento en tu primera compra',
      'Acceso a ofertas exclusivas',
      'Soporte prioritario por email'
    ],
    icon: <StarIcon />,
    description: 'Clientes nuevos que están conociendo nuestros productos.'
  },
  {
    id: 'loyal',
    name: 'Leal',
    minDays: 91,
    maxDays: 365,
    color: '#2196F3', // Blue
    benefits: [
      '10% de descuento en todas las compras',
      'Envío gratuito en órdenes mayores a $50',
      'Acceso anticipado a nuevos productos'
    ],
    icon: <LoyaltyIcon />,
    description: 'Clientes frecuentes que disfrutan de beneficios exclusivos.'
  },
  {
    id: 'veteran',
    name: 'Veterano',
    minDays: 366,
    maxDays: 730,
    color: '#9C27B0', // Purple
    benefits: [
      '15% de descuento en todas las compras',
      'Envío gratuito en todas las órdenes',
      'Regalo de cumpleaños',
      'Soporte prioritario 24/7'
    ],
    icon: <EmojiEventsIcon />,
    description: 'Clientes de larga data con beneficios premium.'
  },
  {
    id: 'ambassador',
    name: 'Embajador',
    minDays: 731,
    color: '#FF9800', // Orange
    benefits: [
      '20% de descuento en todas las compras',
      'Envío gratuito y prioritario',
      'Regalos exclusivos',
      'Acceso VIP a eventos',
      'Sesión personalizada anual'
    ],
    icon: <EmojiEventsIcon color="warning" />,
    description: 'Nuestros clientes más valiosos y embajadores de la marca.'
  }
];

const LoyaltyProgram: React.FC = () => {
  const theme = useTheme();
  const [currentUser, setCurrentUser] = useState(auth.getCurrentUser());
  const hasAdminAccess = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // Función para formatear el número de teléfono
  const formatPhoneNumber = (phone: string): string => {
    // Eliminar cualquier carácter que no sea número
    const cleaned = ('' + phone).replace(/\D/g, '');
    // Aplicar formato (XXX) XXX-XXXX
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone; // Retornar el valor original si no coincide el formato
  };

  // Estado para almacenar los usuarios/clientes
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        console.log('Iniciando carga de usuarios...');
        const users = await userService.getUsers();
        
        console.log('Total de usuarios obtenidos de la API:', users.length);
        
        // Contar usuarios por rol para depuración
        const rolesCount = users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('Usuarios por rol:', rolesCount);
        
        // Filtrar usuarios y mapear al formato CustomerData
        const customersData = users
          .filter(user => {
            const isClient = user.role === 'client';
            if (!isClient) {
              console.log('Usuario filtrado (no es cliente):', user.id, user.role);
            }
            return isClient;
          })
          .map(user => {
            const customer = {
              id: user.id,
              name: user.fullName || 'Cliente sin nombre',
              joinDate: user.createdAt || new Date().toISOString(),
              totalPurchases: 0, // Por ahora no tenemos datos de compras
              email: user.email,
              phone: user.phone
            };
            return customer;
          });
        
        console.log('Total de clientes después de filtrar:', customersData.length);
        
        // Verificar si hay duplicados
        const uniqueIds = new Set(customersData.map(c => c.id));
        if (uniqueIds.size !== customersData.length) {
          console.warn('¡Se detectaron IDs duplicados en los clientes!');
        }
        
        setCustomers(customersData);
      } catch (err) {
        console.error('Error al cargar los usuarios:', err);
        setError('Error al cargar los datos de clientes');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Calculate customer tiers based on join date
  const calculateCustomerTiers = (customers: CustomerData[]) => {
    const today = dayjs();
    console.log('Calculando niveles de fidelidad para', customers.length, 'clientes');
    
    const result = customers.map(customer => {
      try {
        const joinDate = dayjs(customer.joinDate);
        if (!joinDate.isValid()) {
          console.warn('Fecha de unión inválida para el cliente:', customer.id, customer.joinDate);
        }
        
        const diffDays = today.diff(joinDate, 'day');
        
        let tier = loyaltyTiers.find(t => {
          if (t.maxDays) {
            return diffDays >= t.minDays && diffDays <= t.maxDays!;
          }
          return diffDays >= t.minDays;
        }) || loyaltyTiers[0];
        
        return {
          ...customer,
          daysAsCustomer: diffDays,
          tier: tier.name,
          joinDateFormatted: joinDate.isValid() ? joinDate.format('DD/MM/YYYY') : 'Fecha invál'
        };
      } catch (error) {
        console.error('Error procesando cliente:', customer.id, error);
        return {
          ...customer,
          daysAsCustomer: 0,
          tier: 'Error',
          joinDateFormatted: 'Error'
        };
      }
    });
    
    // Contar clientes por nivel para depuración
    const tierCounts = loyaltyTiers.reduce((acc, tier) => {
      acc[tier.name] = result.filter(c => c.tier === tier.name).length;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Distribución de clientes por nivel:', tierCounts);
    
    return result;
  };

  const customersWithTiers = calculateCustomerTiers(customers);

  // Estado para controlar qué beneficios están expandidos
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const toggleBenefits = (tierName: string) => {
    setExpandedTier(expandedTier === tierName ? null : tierName);
  };

  // Beneficios de cada nivel
  const renderBenefits = (tier: LoyaltyTier) => (
    <Box sx={{ mt: 2, transition: 'all 0.3s ease' }}>
      <Button 
        variant="outlined" 
        size="small"
        onClick={() => toggleBenefits(tier.name)}
        startIcon={expandedTier === tier.name ? <ExpandLess /> : <ExpandMore />}
        sx={{ mb: 1 }}
      >
        {expandedTier === tier.name ? 'Ocultar beneficios' : 'Ver beneficios'}
      </Button>
      
      <Collapse in={expandedTier === tier.name}>
        <Box sx={{ 
          p: 2, 
          bgcolor: 'background.paper', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {tier.benefits.map((benefit, index) => (
              <li key={index}>
                <Typography variant="body2">{benefit}</Typography>
              </li>
            ))}
          </ul>
        </Box>
      </Collapse>
    </Box>
  );

  // Filtrar clientes según permisos
  const filteredCustomers = useMemo(() => {
    if (hasAdminAccess) {
      return customersWithTiers;
    }
    // Mostrar solo el perfil del usuario actual si no es administrador
    return customersWithTiers.filter((customer: CustomerData) => customer.id === currentUser?.id);
  }, [customersWithTiers, hasAdminAccess, currentUser?.id]);

  // Prepare data for the pie chart
  const tierCounts = loyaltyTiers.map(tier => {
    const count = filteredCustomers.filter((c: CustomerData) => c.tier === tier.name).length;
    return {
      name: tier.name,
      value: count,
      color: tier.color,
      percentage: filteredCustomers.length > 0 ? (count / filteredCustomers.length * 100).toFixed(1) : '0'
    };
  });
  
  // Mostrar el total de clientes en consola para depuración (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Total de clientes con niveles asignados:', customersWithTiers.length);
    }
  }, [customersWithTiers.length]);

  const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <Typography variant="body2">
            <strong>{data.name}</strong><br />
            {data.value} clientes ({data.percentage}%)
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Navigation title="Programa de Fidelidad" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
              Nivel de Fidelidad
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Descubre los beneficios exclusivos según tu nivel de lealtad
            </Typography>
          </Box>

          {/* Customer Tiers */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {loyaltyTiers.map((tier) => {
              const count = filteredCustomers.filter(c => c.tier === tier.name).length;
              return (
                <Grid item xs={12} sm={6} md={3} key={tier.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderLeft: `4px solid ${tier.color}`,
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: tier.color }}>{tier.icon}</Box>
                          {tier.name}
                        </Typography>
                        <Chip 
                          label={`${count} ${count === 1 ? 'cliente' : 'clientes'}`} 
                          size="small" 
                          sx={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                        {tier.description}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Rango de tiempo:
                        </Typography>
                        <Typography variant="body2">
                          {tier.maxDays 
                            ? `${tier.minDays} - ${tier.maxDays} días` 
                            : `Más de ${tier.minDays} días`}
                        </Typography>
                      </Box>
                      
                      {renderBenefits(tier)}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Chart Section */}
          <Card sx={{ mb: 4, p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Distribución de Clientes por Nivel
                <Tooltip title="Este gráfico muestra la cantidad de clientes en cada nivel de fidelidad">
                  <InfoIcon color="action" fontSize="small" />
                </Tooltip>
              </Typography>
              <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Distribución de Clientes</Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={5}>
                  <Box sx={{ 
                    height: 400, 
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Box sx={{ 
                      width: '100%', 
                      maxWidth: 400, // Tamaño máximo del contenedor del gráfico
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tierCounts}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {tierCounts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Customer List - Solo visible para administradores */}
          {hasAdminAccess && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" sx={{ mt: 6, mb: 2 }}>Lista de Clientes</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 500, mb: 4 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>Nombre</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>Contacto</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>Nivel</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>Días como Cliente</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>Registro</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => {
                          const tier = loyaltyTiers.find(t => t.name === customer.tier);
                          return (
                            <TableRow 
                              key={customer.id} 
                              hover
                              sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                            >
                              <TableCell>
                                <Typography fontWeight="medium">{customer.name}</Typography>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {customer.email && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <span style={{ opacity: 0.7, display: 'inline-flex' }}>📧</span>
                                      <Typography 
                                        variant="body2" 
                                        component="a" 
                                        href={`mailto:${customer.email}`} 
                                        sx={{ 
                                          color: 'primary.main', 
                                          textDecoration: 'none',
                                          '&:hover': { textDecoration: 'underline' },
                                          display: 'inline-block',
                                          maxWidth: '100%',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {customer.email}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customer.phone && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <span style={{ opacity: 0.7, display: 'inline-flex' }}>📱</span>
                                      <Typography 
                                        variant="body2" 
                                        component="a" 
                                        href={`tel:${customer.phone}`} 
                                        sx={{ 
                                          color: 'text.primary', 
                                          textDecoration: 'none',
                                          '&:hover': { textDecoration: 'underline' },
                                          fontFamily: 'monospace',
                                          letterSpacing: '0.5px'
                                        }}
                                      >
                                        {formatPhoneNumber(customer.phone)}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={customer.tier} 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: tier ? `${tier.color}20` : 'default',
                                    color: tier ? tier.color : 'inherit',
                                    fontWeight: 'bold',
                                    border: tier ? `1px solid ${tier.color}40` : 'none'
                                  }} 
                                />
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <span>{customer.daysAsCustomer} días</span>
                                  {tier && (
                                    <Tooltip title={`${tier.minDays}${tier.maxDays ? `-${tier.maxDays}` : '+'} días`}>
                                      <InfoIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7, fontSize: '1rem' }} />
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Tooltip title={dayjs(customer.joinDate).format('dddd, D [de] MMMM [de] YYYY')}>
                                  <span>{customer.joinDateFormatted}</span>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            No hay clientes registrados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default LoyaltyProgram;

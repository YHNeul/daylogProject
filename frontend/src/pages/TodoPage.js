import React from 'react';
import { Container } from '@mui/material';
import TodoList from '../components/TodoList';

const TodoPage = () => {
  return (
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <TodoList />
      </Container>
  );
};

export default TodoPage;
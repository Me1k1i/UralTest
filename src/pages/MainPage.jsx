import { useSelector } from 'react-redux';
import MainLayout from '@/components/layout/MainLayout.jsx';
import { selectActiveWorkplace } from '@/store/workplaceSlice.js';
import PartsWorkplace from '@/workplaces/parts/PartsWorkplace.jsx';

const WORKPLACE_COMPONENTS = {
  parts: PartsWorkplace,
};

export default function MainPage() {
  const workplace = useSelector(selectActiveWorkplace);
  const Workplace = WORKPLACE_COMPONENTS[workplace.id];

  return (
    <MainLayout title={workplace.title}>
      <Workplace title={workplace.title} />
    </MainLayout>
  );
}

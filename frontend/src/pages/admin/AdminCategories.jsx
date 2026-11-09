import TaxonomyManager from '../../components/TaxonomyManager';

export default function AdminCategories() {
  return <TaxonomyManager title="Quản lý danh mục" endpoint="categories" imageField="image" hasParent />;
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Tenant Backoffice</h1>
        <p className="text-gray-500">Manage your store catalog and inventory</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Product Catalog</h2>
          <ul className="divide-y divide-gray-200">
            <li className="py-4 flex justify-between">
              <div>
                <p className="font-medium">Organic Apples</p>
                <p className="text-sm text-gray-500">SKU: APP-001</p>
              </div>
              <p className="font-medium">$1.99</p>
            </li>
          </ul>
          <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
            + Add Product
          </button>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Inventory Overview</h2>
          <ul className="divide-y divide-gray-200">
            <li className="py-4 flex justify-between">
              <div>
                <p className="font-medium">Main Warehouse</p>
                <p className="text-sm text-gray-500">Organic Apples</p>
              </div>
              <p className="font-medium text-green-600">500 in stock</p>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

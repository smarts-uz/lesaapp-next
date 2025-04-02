import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import type { Product } from "@/types/pos";
import { ProductGrid } from "@/components/pos/product-grid";

interface POSProductSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function POSProductSection({ products, onAddToCart }: POSProductSectionProps) {
  // Extract unique categories from product categories arrays
  const categories = Array.from(
    new Set(
      products.flatMap((product) => product.categories)
    )
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Set loading to false when products are available
  useEffect(() => {
    if (products.length > 0) {
      setIsLoading(false);
    }
  }, [products]);

  // Filter products based on search query and active category
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeCategory !== "all") {
      filtered = filtered.filter((product) =>
        product.categories.includes(activeCategory)
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, activeCategory, products]);

  return (
    <div className="flex flex-col w-2/3 h-full">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search scaffolding products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mb-4 flex flex-wrap h-auto">
          <TabsTrigger
            value="all"
            onClick={() => setActiveCategory("all")}
            className="mb-1"
          >
            All
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              onClick={() => setActiveCategory(category)}
              className="mb-1"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <ProductGrid
              products={filteredProducts}
              isLoading={isLoading}
              onAddToCart={onAddToCart}
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
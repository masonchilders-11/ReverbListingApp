import {
    Badge,
    IndexTable,
    Page,
    Card,
    Frame,
    Pagination,
    TextField,
    useIndexResourceState,
    Button,
    ButtonGroup,
    HorizontalStack,
    VerticalStack,
    Text
  } from "@shopify/polaris";
  import { useState, useCallback } from "react";
  
  
  export default function ProductsPage() {
    const products = [
      {
        id: "1020",
        image: "https://picsum.photos/50?random=1",
        name: "1ZPRESSO | J-MAX Manual Coffee Grinder",
        sku: "SKU1020",
        inStock: true,
        stock: 20,
        price: "$200",
        status: <Badge status="success">Active</Badge>,
        lastModified: "2023-10-08",
        reverbActive: <Badge status="success">Active</Badge>,
      },
      {
        id: "1018",
        image: "https://picsum.photos/50?random=2",
        name: "PS5",
        sku: "SKU1018",
        inStock: true,
        stock: 2,
        price: "$200",
        status: <Badge status="success">Active</Badge>,
        lastModified: "2023-9-08",
        reverbActive: <Badge status="info">Draft</Badge>,
      },
      {
        id: "1016",
        image: "https://picsum.photos/50?random=3",
        name: "Netflix subscription",
        sku: "SKU1016",
        inStock: true,
        stock: 10000,
        price: "$200",
        status: <Badge status="info">Draft</Badge>,
        lastModified: "2023-10-9",
        reverbActive: <Badge status="warning">Inactive</Badge>,
      },
      {
        id: "1015",
        image: "https://picsum.photos/50?random=4",
        name: "Earrings",
        sku: "SKU1015",
        inStock: false,
        stock: 0,
        price: "$200",
        status: <Badge status="success">Active</Badge>,
        lastModified: "2023-10-08",
        reverbActive: <Badge status="success">Active</Badge>,
      },
      {
        id: "1014",
        image: "https://picsum.photos/50?random=5",
        name: "Toilet",
        sku: "SKU1014",
        inStock: true,
        stock: 20,
        price: "$200",
        status: <Badge status="success">Active</Badge>,
        lastModified: "2023-10-08",
        reverbActive: <Badge status="success">Active</Badge>,
      },
    ];
    
    const [queryValue, setQueryValue] = useState("");
  
    let filteredProducts = products;
    if (queryValue) {
      filteredProducts = filteredProducts.filter((product) =>
        product.name.toLowerCase().includes(queryValue.toLowerCase())
      );
    }
  
    const noProductsMessage = (
      <div style={{ padding: "20px", textAlign: "center" }}>
        There are no products matching your search.
      </div>
    );
  
    const resourceName = {
      singular: "product",
      plural: "products",
    };
    const { selectedResources, allResourcesSelected, handleSelectionChange } =
      useIndexResourceState(products);
  
    const rowMarkup = filteredProducts.map(
      (
        {
          id,
          image,
          name,
          sku,
          inStock,
          stock,
          price,
          status,
          lastModified,
          reverbActive,
        },
        index
      ) => (
        <IndexTable.Row
          id={id}
          key={id}
          selected={selectedResources.includes(id)}
          position={index}
        >
          <IndexTable.Cell>
          <img src={image} alt={"Product " + name} style={{ display: 'block', margin: 'auto'}} title={name}/>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div title={name}>
          {name.length > 25 ? name.slice(0, 25) + "..." : name}
          </div>
          </IndexTable.Cell>
        <IndexTable.Cell>{sku}</IndexTable.Cell>
        <IndexTable.Cell>{inStock ? "In Stock" : "Out of Stock"}</IndexTable.Cell>
        <IndexTable.Cell>{stock}</IndexTable.Cell>
        <IndexTable.Cell>{price}</IndexTable.Cell>
        <IndexTable.Cell>{status}</IndexTable.Cell>
        <IndexTable.Cell>{lastModified}</IndexTable.Cell>
        <IndexTable.Cell>{reverbActive}</IndexTable.Cell>
        </IndexTable.Row>
      )
    );
  
    const [inputValue, setInputValue] = useState("");
  
    const handleInputChange = (value) => {
      setInputValue(value);
    };
  
    const handleFiltersQueryChange = () => {
      setQueryValue(inputValue);
    };
  
    const handleClearButtonClick = useCallback(() => {
      setInputValue("");
    }, []);
  
    const handleResetButtonClick = useCallback(() => {
      setQueryValue("");
    }, [])
  
    return (
      <Frame>
        <Page title={"Products"} fullWidth>
      <VerticalStack gap="5">
        <Card>
          <VerticalStack gap="2">
          <Text as="h2" variant="headingMd">
              Search for Products
            </Text>
            <HorizontalStack gap="3" align="end">
              <div style={{ flexGrow: 1 }}>
                <TextField
                  value={inputValue}
                  onChange={handleInputChange}
                  label=""
                  placeholder="Type to search..."
                  autoComplete="off"
                  clearButton
                  onClearButtonClick={handleClearButtonClick}
                />
              </div>
              <ButtonGroup>
                <Button onClick={handleFiltersQueryChange}>
                  Search
                </Button>
                <Button onClick={handleResetButtonClick}>
                  Reset
                </Button>
              </ButtonGroup>
            </HorizontalStack>
            {filteredProducts.length === 0 ? (
              noProductsMessage
            ) : (
              <IndexTable
              resourceName={resourceName}
              itemCount={products.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              sortable={[
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
              ]}
              headings={[
                { title: "" },
                { title: "Name" },
                { title: "SKU" },
                { title: "In Stock?" },
                { title: "Stock" },
                { title: "Price" },
                { title: "Status on Shopify" },
                { title: "Last Modified" },
                { title: "Status on Reverb" },
              ]}
              >
                {rowMarkup}
              </IndexTable>
            )}
            <div
              style={{
                width: "100%",
                borderTop: "1px solid var(--p-color-border)",
                paddingTop: "1rem",
              }}
            >
              <Pagination
                onPrevious={() => {
                  console.log("Previous");
                }}
                onNext={() => {
                  console.log("Next");
                }}
                type="table"
                hasNext
                label="1-50 of 8,450 orders"
              />
            </div>
          </VerticalStack>
        </Card>
      </VerticalStack>
    </Page>
      </Frame>
    );
  }
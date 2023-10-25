import { useLoaderData } from "@remix-run/react";
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
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const query = 
  `{
    products(first: 25) {
      edges {
        node {
          id
          title
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                sku
                price
              }
            }
          }
        }
      }
    }
  }`;

  const response = await admin.graphql(query);

  const responseJson = await response.json();

  return responseJson.data.products.edges.map(edge => {
    const node = edge.node;
    return {
      id: node.id,
      image: node.images.edges[0]?.node?.url,
      name: node.title,
      sku: node.variants.edges[0]?.node?.sku,
      price: node.variants.edges[0]?.node?.price,
    };
  });
};

export default function ProductsPage() {
  const initialProducts = useLoaderData();
  const DEFAULT_IMAGE_URL = "https://via.placeholder.com/50";

  const [queryValue, setQueryValue] = useState("");

  let filteredProducts = initialProducts;
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
    useIndexResourceState(initialProducts);

  const rowMarkup = filteredProducts.map(
    (
      {
        id,
        image,
        name,
        sku,
        inStock = true, // inferred default if not provided in actual data
        stock = 0,      // inferred default
        price,
        status = <Badge status="success">Active</Badge>,          // inferred default
        lastModified = "Unknown Date",   // inferred default
        reverbActive = <Badge status="info">Unknown</Badge>,     // inferred default
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
        <img 
          src={image || DEFAULT_IMAGE_URL} 
          alt={"Product " + name} 
          style={{ display: 'block', margin: 'auto', maxWidth: '50px', maxHeight: '50px' }} 
          title={name}
        />
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
            itemCount={initialProducts.length}
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
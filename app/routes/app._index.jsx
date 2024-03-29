import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Badge,
  IndexTable,
  Page,
  Card,
  Frame,
  TextField,
  useIndexResourceState,
  Button,
  ButtonGroup,
  HorizontalStack,
  VerticalStack,
  Checkbox,
  Select,
  Text,
  Toast,
  Modal
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "~/shopify.server";

// Loader function to fetch products from Shopify using the GraphQL Admin API
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);

  // This retrieves the 'query' parameter from the request URL
  const searchQuery = url.searchParams.get('query') || '';
  let query;

  // Escape quotation marks in the search query
  const escapedSearchQuery = searchQuery.replace(/"/g, '\\"');

  // Construct the GraphQL query based on the search query

  // If the search query is empty, fetch the last 25 products created
  if (escapedSearchQuery === '') {
    query = 
    `{
      products(first: 25, reverse: true) {
        edges {
          node {
            id
            title
            description
            descriptionHtml
            vendor
            status
            totalInventory
            totalVariants
            images(first: 10) {
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
                  updatedAt
                  barcode
                }
              }
            }
          }
        }
      }
    }`;
  } else {
    query = 
    `{
      products(query: "${escapedSearchQuery}", first: 25) {
        edges {
          node {
            id
            title
            description
            descriptionHtml
            vendor
            status
            totalInventory
            totalVariants
            images(first: 10) {
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
                  updatedAt
                  barcode
                }
              }
            }
          }
        }
      }
    }`;
  }

  const response = await admin.graphql(query);

  const responseJson = await response.json();

  return {
    products: responseJson.data.products.edges.map(edge => {
    const node = edge.node;
    return {
      id: node.id,
      image: node.images.edges[0]?.node?.url,
      images: node.images.edges.map(edge => edge.node.url),
      name: node.title,
      sku: node.variants.edges[0]?.node?.sku,
      price: node.variants.edges[0]?.node?.price,
      status: node.status,
      lastModified: node.variants.edges[0]?.node?.updatedAt?.substring(0, 10),
      description: node.description,
      descriptionHtml: node.descriptionHtml,
      vendor: node.vendor,
      totalVariants: node.totalVariants,
      totalInventory: node.totalInventory,
      upcCode: node.variants.edges[0]?.node?.barcode || '',
    };
  }),
  reverbToken: process.env.REVERB_API_KEY,
};
};

// Main App component
export default function ProductsPage() {
  const { products: initialProducts, reverbToken } = useLoaderData();
  
  // Default image for products without images
  const DEFAULT_IMAGE_URL = "https://via.placeholder.com/50";

  // State to store the products
  const [searchedProducts, setSearchedProducts] = useState(initialProducts);

  // useEffect hook to update the products when the initialProducts change
  useEffect(() => {
    setSearchedProducts(initialProducts);
  }, [initialProducts]);

  // Message to display when there are no products matching the search query
  const noProductsMessage = (
    <div style={{ padding: "20px", textAlign: "center" }}>
      There are no products matching your search.
    </div>
  );

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(initialProducts);

  // Creating the row markup for the IndexTable
  const rowMarkup = searchedProducts.map(
    (
      {
        id,
        image,
        name,
        totalVariants,
        totalInventory,
        price,
        status,
        lastModified,
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
          <div title={name} style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {name}
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>{totalInventory} in stock for {totalVariants} variant(s)</IndexTable.Cell>
        <IndexTable.Cell>{price}</IndexTable.Cell>
        <IndexTable.Cell>
          {(() => {
            switch (status) {
              case "ACTIVE":
                return <Badge status="success">Active</Badge>;
              case "DRAFT":
                return <Badge status="info">Draft</Badge>;
              case "ARCHIVED":
                return <Badge status="attention">Archived</Badge>;
              default:
                return <Badge status="warning">Unknown</Badge>;
            }
          })()}
        </IndexTable.Cell>
        <IndexTable.Cell>{lastModified}</IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  // Input value for search queries
  const [inputValue, setInputValue] = useState("");

  // Function to handle input change
  const handleInputChange = (value) => {
    setInputValue(value);
  };

  // Submit form for search queries
  const submit = useSubmit();

  // Function to handle query searches
  const handleFiltersQueryChange = () => {
    // Construct a new FormData object, assuming `inputValue` holds the search query
    const formData = new FormData();
    formData.append('query', inputValue);

    // Use the `submit` hook to submit the form data
    submit(formData, { method: 'get', replace: true });
  };

  // Function to handle clearing the input value
  const handleClearButtonClick = useCallback(() => {
    setInputValue("");
  }, []);

  // Function to handle resetting the search query. Sets back to initial state
  const handleResetButtonClick = () => {
    setInputValue("");
    
    const formData = new FormData();
    formData.append('query', "");

    submit(formData, { method: 'get', replace: true });
  };

  // Function to fetch the shipping profile ID from Reverb
  const fetchShipping = async () => {
    const shopUrl = 'https://api.reverb.com/api/shop';

    try {
      const response = await fetch(shopUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/hal+json',
          'Accept': 'application/hal+json',
          'Accept-Version': '3.0',
          'Authorization': `Bearer ${reverbToken}` // Assuming reverbToken is defined globally
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      // Find the shipping profile named "Free Shipping"
      const freeShippingProfile = data.shipping_profiles.find(profile => profile.name === "Free Shipping");
      if (freeShippingProfile) {
        return freeShippingProfile.id; // Return the ID of the "Free Shipping" profile
      } else {
        console.log('No shipping profile found with the name "Free Shipping"')
        return '';
      }

    } catch (error) {
      console.error('Failed to fetch shipping profile:', error);
      throw error; // Rethrow the error to be handled by the caller
    }
  };

  // Initialize the shippingId state with null
  const [shippingId, setShippingId] = useState(null);

  // Fetch the shipping ID using useEffect to trigger the operation on component mount
  useEffect(() => {
    async function fetchAndSetShippingId() {
      try {
        const id = await fetchShipping();
        setShippingId(id); // Update the state with the fetched ID
      } catch (error) {
        console.error("Failed to fetch shipping ID:", error);
      }
    }

    fetchAndSetShippingId();
  }, []);

  // UUIDs for condition and category
  const conditionUUIDs = {
    good: 'f7a3f48c-972a-44c6-b01a-0cd27488d3f6',
    very_good: 'ae4d9114-1bd7-4ec5-a4ba-6653af5ac84d',
    excellent: 'df268ad1-c462-4ba6-b6db-e007e23922ea',
    mint: 'ac5b9c1e-dc78-466d-b0b3-7cf712967a48',
    brand_new: '7c3f45de-2ae0-4c81-8400-fdb6b1d74890',
    blank: ''
  };
  
  const categoryUUIDs = {
    crash: '14351391-330c-4cc5-9094-037f7c88a745',
    hi_hats: '662e6fd4-2465-4699-9b75-32707eb3cfbb',
    ride: 'da296454-3c03-407b-9dca-3b09f9ceef3f',
    other: '93d86ecd-27e6-452c-9a43-16a0c5d547ab',
    blank: 'b3cb9f8e-4cb6-4325-8215-1efcd9999daf'
  };

  // Function to extract the YouTube link from the product HTML description
  function extractYouTubeLink(descriptionHtml) {
    const regex = /src="https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]+)\?/i;
    const match = descriptionHtml.match(regex);
    if (match && match[1]) {
      // If a match is found, construct the full YouTube URL
      return `https://www.youtube.com/watch?v=${match[1]}`;
    } else {
      // If no match is found, return null or an empty string
      return '';
    }
  }

  // State to manage the toast message
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  /*
  Function to create a listing on Reverb. Takes in many properties and uses this to make
  API calls to create a listing on Reverb. This function is called when the user clicks the
  "Create Listing on Reverb" button in the app.
  */

  const createListingOnReverb = async (product, model, finish, condition, category, isDraft) => {
    try {
      // Define the URL for the sandbox environment
      const url = 'https://api.reverb.com/api/listings';

      const youtube = extractYouTubeLink(product.descriptionHtml);

      let productTitle = youtube === '' ? product.name : `${product.name} w/ video demo of actual cymbal for sale`;

      let hasUpcCode = product.upcCode !== '';

      // Check if any required field is missing or if isDraft is true
      let isLikelyDraft = isDraft || !product.vendor || !model || !product.images || product.images.length === 0 || !product.description || !condition || !product.price;

      if (!model || product.images.length === 0) {
        isDraft = true;
      }
  
      // Create the data payload
      const payload = {
        make: product.vendor, // REQUIRED
        model: model, // REQUIRED
        photos: product.images.length !== 0 ? product.images : [], // REQUIRED
        description: product.description, // REQUIRED
        finish: finish,
        price: { // REQUIRED
          amount: product.price,
          currency: "USD"
        },
        condition: { // REQUIRED
          uuid: conditionUUIDs[condition]
        },
        categories: [{ uuid: categoryUUIDs[category] }], // REQUIRED
        title: productTitle, // REQUIRED
        shipping_profile_id: shippingId, // REQUIRED
        videos: [{ link: youtube }],
        upc: product.upcCode, // ONLY REQUIRED IF UPC CODE EXISTS
        upc_does_not_apply: !hasUpcCode,
        sku: product.sku,
        has_inventory: true,
        inventory: product.totalInventory,
        offers_enabled: true,
        publish: !isDraft
      };

      console.log(JSON.stringify(payload));

      // Make the API call to the server endpoint
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/hal+json',
          'Accept-Version': '3.0',
          'Authorization': `Bearer ${reverbToken}` // Using environment variable for security
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        setShowToast(true);
        setToastMessage('Failed to create product listing on Reverb.');
        setTimeout(() => setShowToast(false), 5000);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log('Listing created on Reverb:', result);
      setShowToast(true);

      // Modify the success toast message based on isLikelyDraft
      if (isLikelyDraft) {
        if (product.images.length === 0) {
          setToastMessage('Product listing was likely published as a draft on Reverb due to missing images.');
        } else {
          setToastMessage('Product listing was likely published as a draft on Reverb.');
        }
      } else {
        setToastMessage('Product listing created successfully on Reverb!');
      }
      setTimeout(() => setShowToast(false), 5000);

    } catch (error) {
      setShowToast(true);
      if (!model) {
        setToastMessage('Please enter a model for the product.');
      } else {
      setToastMessage('Failed to create product listing on Reverb.');
      }
      setTimeout(() => setShowToast(false), 5000);
      console.error('Error creating listing on Reverb:', error);
    }
  };

  // Promoted bulk actions for the IndexTable
  const promotedBulkActions = [
    {
      content: 'Create Listing on Reverb',
      onAction: () => openModalForSelectedProducts()
    }
  ];

  // Many states to change the reverb listing based on inputs to the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [model, setModel] = useState('');
  const [finish, setFinish] = useState('');
  const [condition, setCondition] = useState('');
  const [category, setCategory] = useState('blank');
  const [isDraft, setIsDraft] = useState(false);

  // Adjust to open the modal for the first selected product
  const openModalForSelectedProducts = useCallback(() => {
    if (selectedResources.length > 0) {
      setCurrentProductIndex(0); // Start with the first selected product
      setIsModalOpen(true);
    }
  }, [selectedResources]);

  // Adjust the primary action to handle submission for one product at a time
  const handleModalFormSubmit = useCallback(() => {
    const productId = selectedResources[currentProductIndex];
    const product = initialProducts.find(product => product.id === productId);
    createListingOnReverb(product, model, finish, condition, category, isDraft);

    const nextProductIndex = currentProductIndex + 1;
    if (nextProductIndex < selectedResources.length) {
      setCurrentProductIndex(nextProductIndex); // Move to the next product
      setModel('');
      setFinish('');
      setCategory('blank');
      setCondition('');
      setIsDraft(false);
      // The modal stays open, ready for the next product's details

    } else {
      setModel('');
      setFinish('');
      setCategory('blank');
      setCondition('');
      setIsModalOpen(false);
      setIsDraft(false);
    }
  }, [currentProductIndex, selectedResources, model, finish, condition, category, isDraft, initialProducts]);

  // When rendering the modal, use the current product's title in the modal title or content
  const currentProductId = selectedResources[currentProductIndex];
  const currentProduct = initialProducts.find(product => product.id === currentProductId);

  // Return the main JSX for the app. Uses the Shopigy Polaris components to create the UI
  return (
    <Frame>
      <Page title={"Products"} fullWidth>
    <VerticalStack gap="5">

    {showToast && (
      <Toast content={toastMessage} onDismiss={() => setShowToast(false)} />
    )}

    <Modal
    open={isModalOpen}
    onClose={() => {
      setIsModalOpen(false);
      setModel('');
      setFinish('');
      setCategory('blank');
      setCondition('');
      setIsDraft(false);
    }}
    title={`Enter Details for: ${currentProduct ? currentProduct.name : ''}`}
    primaryAction={{
      content: 'Submit',
      onAction: handleModalFormSubmit,
    }}
    secondaryActions={[
      {
        content: 'Cancel',
        onAction: () => {
          setIsModalOpen(false);
          setModel('');
          setFinish('');
          setCategory('blank');
          setCondition('');
          setIsDraft(false);
        },
      },
    ]}
  >
    <Modal.Section>
      <VerticalStack gap="5">
        <TextField
          value={model}
          onChange={(value) => setModel(value)}
          label="Model"
          type="text"
          placeholder="Enter model here..."
          autoComplete="on"
        />
        <TextField
          value={finish}
          onChange={(value) => setFinish(value)}
          label="Finish"
          type="text"
          placeholder="Enter finish here..."
          autoComplete="on"
        />

        <Select
          label="Condition"
          options={[
            {label: '--', value: 'blank'},
            {label: 'Good', value: 'good'},
            {label: 'Very Good', value: 'very_good'},
            {label: 'Excellent', value: 'excellent'},
            {label: 'Mint', value: 'mint'},
            {label: 'Brand New', value: 'brand_new'}
          ]}
          onChange={setCondition}
          value={condition}
        />

        <Select
          label="Category"
          options={[
            {label: '--', value: 'blank'},
            {label: 'Crash', value: 'crash'},
            {label: 'Hi-Hats', value: 'hi_hats'},
            {label: 'Ride', value: 'ride'},
            {label: 'Other', value: 'other'},
          ]}
          onChange={setCategory}
          value={category}
        />

        <Checkbox
          label="Draft Listing"
          checked={isDraft}
          onChange={(newIsDraft) => setIsDraft(newIsDraft)}
        />
      </VerticalStack>
    </Modal.Section>
  </Modal>

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
                autoComplete="on"
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
          {searchedProducts.length === 0 ? (
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
            ]}
            headings={[
              { title: "" },
              { title: "Name" },
              { title: "Stock" },
              { title: "Price" },
              { title: "Status on Shopify" },
              { title: "Last Modified" },
            ]}
            promotedBulkActions={promotedBulkActions}
            >
              {rowMarkup}
            </IndexTable>
          )}
        </VerticalStack>
      </Card>
    </VerticalStack>
  </Page>
    </Frame>
  );
}